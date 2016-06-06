/**
 * Created by zibx on 6/4/16.
 */

module.exports = {
    width: 12,
    items: [
        {
            style: {border: {width:1, symbol: ['-','*']}},
            items: [
                {style: {float: 'left', width: '40%'}, value: 'AAAA'},
                {style: {float: 'right', width: '60%'}, fill: 'B'},
                {
                    type: 'table',
                    height: 5,
                    style: {border: 'inner'},
                    header: [
                        {value: 'AAAA', width: 4},
                        {fill: 'B'}
                    ],
                    rows: [
                        [
                            {items: [
                                {value: 'T', style: {float: 'left'}},
                                {value: 'H', style: {float: 'right'}}
                            ]},
                            {items: [
                                {value: 'T', style: {float: 'left'}},
                                {value: 'H', style: {float: 'right'}}
                            ]}
                        ]
                    ]
                },
                {style: {width:4, float: 'left'}, items: [

                    {type: 'line', fill: '-'}
                    {type: 'line', fill: '-'}
                ]}
            ]
        }
    ]
};